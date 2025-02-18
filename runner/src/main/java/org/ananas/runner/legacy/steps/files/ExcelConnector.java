package org.ananas.runner.legacy.steps.files;

import java.io.Serializable;
import org.ananas.runner.kernel.AbstractStepRunner;
import org.ananas.runner.kernel.errors.ErrorHandler;
import org.ananas.runner.kernel.model.StepType;
import org.apache.beam.sdk.Pipeline;
import org.apache.beam.sdk.schemas.Schema;
import org.apache.beam.sdk.transforms.Create;
import org.apache.beam.sdk.values.PBegin;
import org.apache.commons.lang3.tuple.MutablePair;

public class ExcelConnector extends AbstractStepRunner implements Serializable {

  private static final long serialVersionUID = 3622276763366208866L;

  public ExcelConnector(
      String stepId,
      Pipeline pipeline,
      ExcelStepConfig config,
      boolean doSampling,
      boolean isTest) {
    super(StepType.Connector);
    this.stepId = stepId;
    ErrorHandler errorHandler = new ErrorHandler();

    MutablePair<Schema, Iterable<org.apache.beam.sdk.values.Row>> r =
        ExcelPaginator.extractWorkbook(errorHandler, config, 0, Integer.MAX_VALUE / 2, e -> e);
    Create.Values<org.apache.beam.sdk.values.Row> excelRows = Create.of(r.getRight());
    this.output = PBegin.in(pipeline).apply(excelRows);
    this.output.setRowSchema(r.getLeft());
  }
}
